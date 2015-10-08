/// <reference path="../typings/tsd.d.ts" />

module typewriter {

	interface IWriterAttributes extends ng.IAttributes {
		lines: string;
		printFn?: string;
		delay?: string|number;
	}

	interface IWriter {
		lines:string[];
		result:string[];
		delay?:number;
		printFn?: () => void;
		doneWritting:boolean;
	}

	class WriterCtrl implements IWriter {
		lines:string[];
		result:string[];
		delay:number;
		printFn:() => void;
		doneWritting:boolean = true;

		private tempLines:string[];

		static $inject = ['$timeout', '$scope', '$attrs'];

		constructor(private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope,
					private $attrs:IWriterAttributes) {

			$scope.$watch($attrs.lines, () => this.print());
			$scope.$watch($attrs.printFn, () => this.exposePrint());
			$scope.$on('TypewriterLine:done', () => this.appendNext());
		}

		private print = ():void => {
			this.tempLines = angular.copy(this.lines);
			this.result = [];
			if (this.tempLines)
				this.doneWritting = false;
				this.$scope.$emit('Typewriter:start', this.doneWritting);
				this.appendNext();
		};

		private appendNext():void {
			this.$timeout(() => {
				var line = this.tempLines.shift();
				if (line != null) {
					this.result.push(line);
				} else {
					this.doneWritting = true;
					this.$scope.$emit('Typewriter:done', this.doneWritting);
				}
			}, this.delay);
		}

		private exposePrint():void {
			this.printFn = this.print;
		}
	}

	export class WriterDirective implements ng.IDirective {
		restrict = 'E';
		scope = true;
		controller = WriterCtrl;
		controllerAs = 'W';
		bindToController = {
			lines: '=',
			delay: '@?',
			printFn: '=?'
		};
		template = "<lines ng-class='{active: !WL.doneWritting}'><tt-line ng-repeat='line in W.result track by $index' text='line' delay='{{W.delay}}'></lines>";

		static Factory:ng.IDirectiveFactory = () => new WriterDirective();
	}

	angular.module('touk.typewriter', ['touk.typewriter.line'])
		.directive("ttWriter", WriterDirective.Factory);
}