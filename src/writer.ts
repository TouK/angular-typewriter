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
	}

	class WriterCtrl implements IWriter {
		lines:string[];
		result:string[];
		delay:number = 100;
		printFn:() => void;
		private tempLines:string[];

		static $inject = ['$timeout', '$scope', '$attrs'];

		constructor(private $timeout:ng.ITimeoutService,
					private $scope:ng.IScope,
					private $attrs:IWriterAttributes) {

			$scope.$watch($attrs.lines, () => this.print());
			$scope.$watch($attrs.printFn, () => {
				this.exposePrint()
			});
			$scope.$on('TypewriterLine:done', () => this.appendNext());
		}

		private print = ():void => {
			this.tempLines = angular.copy(this.lines);
			this.result = [];
			if (this.tempLines) this.$timeout(() => {
				this.result.push(this.tempLines.shift());
			});
		};

		private appendNext():void {
			this.$timeout(() => {
				var line = this.tempLines.shift();
				if (line) this.result.push(line);
			}, this.delay * 3);
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
		template = "<tt-line ng-repeat='line in W.result track by $index' text='line' delay='{{W.delay}}'>";

		static Factory:ng.IDirectiveFactory = () => new WriterDirective();
	}

	angular.module('touk.typewriter', ['touk.typewriter.line'])
		.directive("ttWriter", WriterDirective.Factory);
}